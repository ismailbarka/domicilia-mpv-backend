const { z } = require("zod");

const latLngSchema = z.number({ required_error: "Location coordinate is required" })
  .or(z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid coordinate format").transform(Number));

const createProviderSchema = z.object({
  firstnameFr: z.string().min(1, "firstnameFr is required"),
  lastnameFr: z.string().min(1, "lastnameFr is required"),
  firstnameAr: z.string().min(1, "firstnameAr is required"),
  lastnameAr: z.string().min(1, "lastnameAr is required"),
  phone: z.string().min(1, "Phone is required"),
  descriptionFr: z.string().min(1, "descriptionFr is required"),
  descriptionAr: z.string().min(1, "descriptionAr is required"),
  latitude: latLngSchema,
  longitude: latLngSchema,
  categoryId: z.number().int().positive().or(z.string().regex(/^\d+$/).transform(Number)),
  photo: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).or(z.string().regex(/^[1-5]$/).transform(Number)),
  age: z.number().int().positive().optional().nullable()
    .or(z.string().regex(/^\d+$/).transform(Number).optional().nullable()),
});

const updateProviderSchema = createProviderSchema.partial();

const createCategorySchema = z.object({
  nameFr: z.string().min(1, "nameFr is required"),
  nameAr: z.string().min(1, "nameAr is required"),
});

module.exports = {
  createProviderSchema,
  updateProviderSchema,
  createCategorySchema,
};
