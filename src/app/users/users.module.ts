import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';

import { MicButtonComponent } from './mic-button/mic-button.component';
import { AllProfilesComponent } from './all-profiles/all-profiles.component';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    UsersRoutingModule
  ]
})
export class UsersModule { }
