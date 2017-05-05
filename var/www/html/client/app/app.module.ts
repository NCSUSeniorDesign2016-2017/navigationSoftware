import { NgModule }        from '@angular/core';
import { OnInit }          from '@angular/core';
import { BrowserModule }   from '@angular/platform-browser';
import { HttpModule }      from '@angular/http';
import { FormsModule }     from '@angular/forms';

import { AppComponent }    from './app.component';
import { SwitchComponent } from 'angular2-bootstrap-switch/lib/switch.component.js';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
  	BrowserModule,
    HttpModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [

  ],
  declarations: [
  	AppComponent,
    SwitchComponent
  ],
  bootstrap: [
  	AppComponent
  ]
})
export class AppModule { }
