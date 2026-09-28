import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { requireAuth, type AuthRequest } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AppError } from "../../utils/appError.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { UserModel } from "./user.model.js";

/** Decoded image limit; clients resize to 256×256 JPEG before uploading. */
export const AVATAR_MAX_BYTES = 64 * 1024;
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

// File signatures, so a renamed non-image can't be stored as a photo.
const matchesType = (type: string, bytes: Buffer) =>
  type === "jpeg"
    ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : type === "png"
      ? bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";

export const avatarRouter = Router();
avatarRouter.use(requireAuth);

avatarRouter.get(
  "/",
  catchAsync(async (request: Request, response: Response) => {
    const user = await UserModel.findById((request as AuthRequest).userId).select("+avatar");
    if (!user) throw new AppError("User not found", 404);
    response.json({ data: { avatar: user.avatar ?? null } });
  })
);

avatarRouter.put(
  "/",
  validateRequest({ body: z.object({ image: z.string().max(100_000) }).strict() }),
  catchAsync(async (request: Request, response: Response) => {
    const { image } = request.body as { image: string };
    const match = DATA_URL.exec(image);
    if (!match) throw new AppError("Upload a JPEG, PNG or WebP image", 400);
    const bytes = Buffer.from(match[2]!, "base64");
    if (bytes.length > AVATAR_MAX_BYTES) throw new AppError("That photo is too large", 413);
    if (!matchesType(match[1]!, bytes)) throw new AppError("That file isn't a valid image", 400);
    await UserModel.updateOne({ _id: (request as AuthRequest).userId }, { $set: { avatar: image } });
    response.json({ data: { avatar: image } });
  })
);

avatarRouter.delete(
  "/",
  catchAsync(async (request: Request, response: Response) => {
    await UserModel.updateOne({ _id: (request as AuthRequest).userId }, { $unset: { avatar: 1 } });
    response.json({ data: { avatar: null } });
  })
);
