import type * as ImagePickerModule from "expo-image-picker";
import type * as ImageManipulatorModule from "expo-image-manipulator";

/** Output edge (px) of the uploaded profile photo. */
export const AVATAR_SIZE = 256;
/** Server accepts <= 64 KB decoded (~87k base64 chars); stay safely under. */
export const AVATAR_BASE64_LIMIT = 85_000;
const COMPRESS_STEPS = [0.7, 0.5, 0.35];

export const AVATAR_UNAVAILABLE_MESSAGE =
  "Photo picking isn't available in this version of Pulse. Please update the app.";

/**
 * Native modules are required lazily: a binary built without them must
 * never crash at import time, only report that the feature is unavailable.
 */
const loadNative = <T>(load: () => T): T | null => {
  try {
    return load();
  } catch (error) {
    console.error("[avatar] Native module unavailable", error);
    return null;
  }
};

/**
 * Opens the system photo picker (Android 13+ Photo Picker / iOS PHPicker; no
 * storage or camera permission), lets the user crop a square, then resizes to
 * 256×256 JPEG. Resolves a data URL, or null if the user cancelled.
 */
export const pickAvatarDataUrl = async (): Promise<string | null> => {
  const ImagePicker = loadNative(() => require("expo-image-picker") as typeof ImagePickerModule);
  const Manipulator = loadNative(
    () => require("expo-image-manipulator") as typeof ImageManipulatorModule
  );
  if (!ImagePicker?.launchImageLibraryAsync || !Manipulator?.manipulateAsync)
    throw new Error(AVATAR_UNAVAILABLE_MESSAGE);

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    allowsMultipleSelection: false,
    exif: false,
    base64: false
  });
  const asset = !result || result.canceled ? null : result.assets?.[0];
  if (!asset?.uri) return null;

  const { manipulateAsync, SaveFormat } = Manipulator;
  // 1) Scale the shorter side to 256 (keeps aspect; the dimensions of this
  //    result are reliable even when the picker's are not).
  const landscape = (asset.width ?? 0) > (asset.height ?? 0);
  const scaled = await manipulateAsync(
    asset.uri,
    [{ resize: landscape ? { height: AVATAR_SIZE } : { width: AVATAR_SIZE } }],
    { compress: 1, format: SaveFormat.JPEG }
  );
  // 2) Centre-crop to a square if the crop step didn't already make one.
  const side = Math.min(scaled.width, scaled.height);
  const actions: ImageManipulatorModule.Action[] =
    scaled.width !== scaled.height && side > 0
      ? [
          {
            crop: {
              originX: Math.floor((scaled.width - side) / 2),
              originY: Math.floor((scaled.height - side) / 2),
              width: side,
              height: side
            }
          }
        ]
      : [];
  if (side > AVATAR_SIZE) actions.push({ resize: { width: AVATAR_SIZE, height: AVATAR_SIZE } });

  // 3) Encode, re-compressing if the photo is still too large to upload.
  for (const compress of COMPRESS_STEPS) {
    const encoded = await manipulateAsync(scaled.uri, actions, {
      compress,
      format: SaveFormat.JPEG,
      base64: true
    });
    if (encoded.base64 && encoded.base64.length <= AVATAR_BASE64_LIMIT)
      return `data:image/jpeg;base64,${encoded.base64}`;
  }
  throw new Error("That photo is too large. Try a different one.");
};
