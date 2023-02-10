import { Component } from '@angular/core';
import { GoogleService, UserInfo } from './google.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'environment';

  userInfo?: UserInfo;

  constructor(private readonly googleService: GoogleService) {
    googleService.userProfileSubject.subscribe( info => {
      this.userInfo = info
    })
  }

  links = ["home", "graph", "game", "contact"];
  names = ["home", "graph", "game", "contact"];

  isLoggedIn(): boolean {
    return this.googleService.isLoggedIn()
  }

  logout() {
    this.googleService.signOut()
  }

}
