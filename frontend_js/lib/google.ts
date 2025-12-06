import { google } from 'googleapis';

export async function getAuthClient(accessToken: string) {
  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials({ access_token: accessToken });
  return oAuth2Client;
}
