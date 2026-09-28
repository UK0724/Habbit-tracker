import { Alert, Linking } from "react-native";

export const PRIVACY_POLICY_URL = "https://habbit.abuk.in/privacy";
export const DELETE_ACCOUNT_HELP_URL = "https://habbit.abuk.in/delete-account";

/** Opens a web page in the browser; explains if the device can't. */
export const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error("[links] Could not open", url, error);
    Alert.alert("Couldn't open the page", `Visit ${url.replace("https://", "")} in your browser.`);
  }
};
