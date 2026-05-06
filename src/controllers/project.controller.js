import Project from '../models/project.js';
import Client from '../models/client.js';
import AppError from '../utils/appError.js';

export const createProject = async (req, res, next) => {
  try {
    const { name, projectCode, client: clientId, address, email, notes } = req.body;
    const { _id: user, company } = req.user;

    if (!company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const client = await Client.findOne({ _id: clientId, company, deleted: false });
    if (!client) throw AppError.notFound('Cliente no encontrado en tu compañía');

    const existing = await Project.findOne({ company, projectCode, deleted: false });
    if (existing) throw AppError.conflict('Ya existe un proyecto con ese código en tu compañía');

    const project = await Project.create({ user, company, client: clientId, name, projectCode, address, email, notes });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { company } = req.user;
    if (!company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const { page = 1, limit = 10, name, client, active, sort = '-createdAt' } = req.query;

    const filter = { company, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (client) filter.client = client;
    if (active !== undefined) filter.active = active === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort(sort).skip(skip).limit(Number(limit)),
      Project.countDocuments(filter)
    ]);

    res.json({
      projects,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const { company } = req.user;
    const project = await Project.findOne({ _id: req.params.id, company, deleted: false })
      .populate('client', 'name cif email');
    if (!project) throw AppError.notFound('Proyecto no encontrado');
    res.json({ project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { company } = req.user;

    if (req.body.client) {
      const client = await Client.findOne({ _id: req.body.client, company, deleted: false });
      if (!client) throw AppError.notFound('Cliente no encontrado en tu compañía');
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company, deleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) throw AppError.notFound('Proyecto no encontrado');

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { company } = req.user;
    const soft = req.query.soft === 'true';

    if (soft) {
      const project = await Project.findOneAndUpdate(
        { _id: req.params.id, company, deleted: false },
        { deleted: true },
        { new: true }
      );
      if (!project) throw AppError.notFound('Proyecto no encontrado');
      return res.json({ message: 'Proyecto archivado correctamente' });
    }

    const project = await Project.findOneAndDelete({ _id: req.params.id, company });
    if (!project) throw AppError.notFound('Proyecto no encontrado');

    res.json({ message: 'Proyecto eliminado permanentemente' });
  } catch (error) {
    next(error);
  }
};

export const getArchivedProjects = async (req, res, next) => {
  try {
    const { company } = req.user;
    const projects = await Project.find({ company, deleted: true }).populate('client', 'name cif');
    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const { company } = req.user;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company, deleted: true },
      { deleted: false },
      { new: true }
    );
    if (!project) throw AppError.notFound('Proyecto archivado no encontrado');
    res.json({ project });
  } catch (error) {
    next(error);
  }
};
