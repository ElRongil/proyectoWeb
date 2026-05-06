import Client from '../models/client.js';
import AppError from '../utils/appError.js';

export const createClient = async (req, res, next) => {
  try {
    const { name, cif, email, phone, address } = req.body;
    const { _id: user, company } = req.user;

    if (!company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const existing = await Client.findOne({ company, cif, deleted: false });
    if (existing) throw AppError.conflict('Ya existe un cliente con ese CIF en tu compañía');

    const client = await Client.create({ user, company, name, cif, email, phone, address });

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const { company } = req.user;
    if (!company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query;

    const filter = { company, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Client.countDocuments(filter)
    ]);

    res.json({
      clients,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems
    });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const { company } = req.user;
    const client = await Client.findOne({ _id: req.params.id, company, deleted: false });
    if (!client) throw AppError.notFound('Cliente no encontrado');
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const { company } = req.user;

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company, deleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) throw AppError.notFound('Cliente no encontrado');

    res.json({ client });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const { company } = req.user;
    const soft = req.query.soft === 'true';

    if (soft) {
      const client = await Client.findOneAndUpdate(
        { _id: req.params.id, company, deleted: false },
        { deleted: true },
        { new: true }
      );
      if (!client) throw AppError.notFound('Cliente no encontrado');
      return res.json({ message: 'Cliente archivado correctamente' });
    }

    const client = await Client.findOneAndDelete({ _id: req.params.id, company });
    if (!client) throw AppError.notFound('Cliente no encontrado');

    res.json({ message: 'Cliente eliminado permanentemente' });
  } catch (error) {
    next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
    const { company } = req.user;
    const clients = await Client.find({ company, deleted: true });
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const { company } = req.user;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company, deleted: true },
      { deleted: false },
      { new: true }
    );
    if (!client) throw AppError.notFound('Cliente archivado no encontrado');
    res.json({ client });
  } catch (error) {
    next(error);
  }
};
