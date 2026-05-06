import DeliveryNote from '../models/deliverynote.js';
import Project from '../models/project.js';
import Client from '../models/client.js';
import AppError from '../utils/appError.js';
import { uploadImage, uploadPdf } from '../services/storage.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';
import sharp from 'sharp';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const { _id: user, company } = req.user;
    if (!company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const { project: projectId, client: clientId } = req.body;

    const [project, client] = await Promise.all([
      Project.findOne({ _id: projectId, company, deleted: false }),
      Client.findOne({ _id: clientId, company, deleted: false })
    ]);

    if (!project) throw AppError.notFound('Proyecto no encontrado en tu compañía');
    if (!client) throw AppError.notFound('Cliente no encontrado en tu compañía');

    const deliveryNote = await DeliveryNote.create({ ...req.body, user, company });

    res.status(201).json({ deliveryNote });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const { company } = req.user;
    if (!company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const {
      page = 1, limit = 10,
      project, client, format, signed,
      from, to,
      sort = '-workDate'
    } = req.query;

    const filter = { company, deleted: false };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (signed !== undefined) filter.signed = signed === 'true';
    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [deliveryNotes, totalItems] = await Promise.all([
      DeliveryNote.find(filter)
        .populate('client', 'name cif')
        .populate('project', 'name projectCode')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      DeliveryNote.countDocuments(filter)
    ]);

    res.json({
      deliveryNotes,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNote = async (req, res, next) => {
  try {
    const { company } = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, company, deleted: false })
      .populate('user', 'name lastName email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address email notes');

    if (!deliveryNote) throw AppError.notFound('Albarán no encontrado');

    res.json({ deliveryNote });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const { company } = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, company, deleted: false });
    if (!deliveryNote) throw AppError.notFound('Albarán no encontrado');

    if (deliveryNote.signed) {
      throw AppError.badRequest('No se puede eliminar un albarán firmado');
    }

    await deliveryNote.deleteOne();

    res.json({ message: 'Albarán eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const { company } = req.user;
    if (!req.file) throw AppError.badRequest('La imagen de firma es obligatoria');

    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, company, deleted: false })
      .populate('user', 'name lastName email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address notes')
      .populate('company');

    if (!deliveryNote) throw AppError.notFound('Albarán no encontrado');
    if (deliveryNote.signed) throw AppError.badRequest('El albarán ya está firmado');

    // Optimizar firma con Sharp y subir a Cloudinary
    const optimizedSignature = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const { url: signatureUrl } = await uploadImage(optimizedSignature, 'bildyapp/signatures');

    // Marcar como firmado antes de generar el PDF (para que aparezca en el PDF)
    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = signatureUrl;

    // Generar PDF con la firma embebida
    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote, optimizedSignature);
    const { url: pdfUrl } = await uploadPdf(pdfBuffer, 'bildyapp/pdfs');

    deliveryNote.pdfUrl = pdfUrl;
    await deliveryNote.save();

    res.json({ message: 'Albarán firmado correctamente', signatureUrl, pdfUrl });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotePdf = async (req, res, next) => {
  try {
    const { company } = req.user;

    const deliveryNote = await DeliveryNote.findOne({ _id: req.params.id, company, deleted: false })
      .populate('user', 'name lastName email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address notes')
      .populate('company');

    if (!deliveryNote) throw AppError.notFound('Albarán no encontrado');

    // Si ya está firmado y tiene PDF en la nube, redirigir directamente
    if (deliveryNote.signed && deliveryNote.pdfUrl) {
      return res.redirect(deliveryNote.pdfUrl);
    }

    // Generar PDF al vuelo (sin firma)
    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="albaran-${deliveryNote._id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
