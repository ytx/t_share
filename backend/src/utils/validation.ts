import Joi from 'joi';

// User validation schemas
export const userValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30),
    displayName: Joi.string().min(1).max(100),
    password: Joi.string().min(6).max(128).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    displayName: Joi.string().min(1).max(100),
  }),
};

// Template validation schemas
export const templateValidation = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).allow(''),
    content: Joi.string().required(),
    description: Joi.string().max(1000).allow(''),
    sceneId: Joi.number().integer().positive().allow(null),
    status: Joi.string().valid('draft', 'published').default('draft'),
    isPublic: Joi.boolean().default(true),
    tagIds: Joi.array().items(Joi.number().integer().positive()).default([]),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).allow(''),
    content: Joi.string().required(),
    description: Joi.string().max(1000).allow(''),
    sceneId: Joi.number().integer().positive().allow(null),
    status: Joi.string().valid('draft', 'published'),
    isPublic: Joi.boolean(),
    tagIds: Joi.array().items(Joi.number().integer().positive()),
  }),

  search: Joi.object({
    keyword: Joi.string().max(100),
    sceneId: Joi.number().integer().positive(),
    createdBy: Joi.string(),
    status: Joi.string().valid('active', 'all').default('active'),
    tagIds: Joi.string().allow('').optional(),
    sortBy: Joi.string().valid('lastUsed', 'updated', 'created').default('updated'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    adminMode: Joi.boolean().default(false),
  }),
};

// Scene validation schemas
export const sceneValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(1000),
  }),
};

// Tag validation schemas
export const tagValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(50).required(),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(50),
    description: Joi.string().max(1000),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  }),
};

// Project validation schemas
export const projectValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(1000),
    isPublic: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(1000),
    isPublic: Joi.boolean(),
  }),
};

// Variable validation schemas
export const variableValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    value: Joi.string().required(),
    description: Joi.string().max(1000),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    value: Joi.string(),
    description: Joi.string().max(1000),
  }),
};

// Document validation schemas
export const documentValidation = {
  create: Joi.object({
    projectId: Joi.number().integer().positive(),
    title: Joi.string().max(200),
    content: Joi.string().required(),
    contentMarkdown: Joi.string().required(),
  }),

  update: Joi.object({
    projectId: Joi.number().integer().positive(),
    title: Joi.string().max(200),
    content: Joi.string(),
    contentMarkdown: Joi.string(),
  }),
};

// User preferences validation
export const preferencesValidation = {
  update: Joi.object({
    theme: Joi.string().valid('light', 'dark'),
    editorKeybinding: Joi.string().valid('default', 'vim', 'emacs'),
    editorShowLineNumbers: Joi.boolean(),
    editorWordWrap: Joi.boolean(),
    editorShowWhitespace: Joi.boolean(),
    panelSplitRatio: Joi.number().min(0.1).max(0.9),
  }),
};