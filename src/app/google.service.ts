import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { environment } from 'src/environments/environment';

const oAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  strictDiscoveryDocumentValidation: false,
  redirectUri: window.location.origin,
  clientId:
    environment.clientId,
  scope:
    'openid profile email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.file',
};

export interface UserInfo {
  info: {
    sub: string;
    email: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  drive = 'https://www.googleapis.com/drive/v3';

  userProfileSubject = new Subject<UserInfo>();

  constructor(
    private readonly oAuthService: OAuthService,
    private httpClient: HttpClient
  ) {
    oAuthService.configure(oAuthConfig);
    oAuthService.logoutUrl = 'https://www.google.com/accounts/Logout';
    oAuthService.loadDiscoveryDocument().then(() => {
      oAuthService.tryLoginImplicitFlow().then(() => {
        if (!oAuthService.hasValidAccessToken()) {
          oAuthService.initLoginFlow();
        } else {
          oAuthService.loadUserProfile().then((userProfile) => {
            this.userProfileSubject.next(userProfile as UserInfo);
          });
        }
      });
    });
  }

  listFiles(): Observable<any> {
    const params = {
      q: "mimeType != 'application/vnd.google-apps.folder' and name contains 'csv' and trashed=false",
      spaces: 'drive',
      fields: 'nextPageToken, files(name,id)',
      orderBy: 'createdTime',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    };
    return this.httpClient.get(`${this.drive}/files`, {
      responseType: 'text',
      params: params,
    });
  }

  getFiles(fileId: string): Observable<any> {
    const params = {
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fileId: fileId,
      alt: 'media',
    };
    return this.httpClient.get(`${this.drive}/files/${fileId}`, {
      responseType: 'text',
      params: params,
    });
  }

  isLoggedIn(): boolean {
    return this.oAuthService.hasValidAccessToken();
  }

  signOut() {
    this.oAuthService.logOut();
  }
}
