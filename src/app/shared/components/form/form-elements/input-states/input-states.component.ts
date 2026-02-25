
import { Component } from '@angular/core';

@Component({
  selector: 'app-input-states',
  templateUrl: './input-states.component.html',
  styles: ``
})
export class InputStatesComponent {

  email = '';
  emailTwo = 'hello.pimjo@gmail.com';
  error = false;

  validateEmail(value: string): boolean {
    const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    this.error = !isValidEmail;
    return isValidEmail;
  }

  handleEmailChange(value: string | number | null) {
    this.email = value == null ? '' : value.toString();
    this.validateEmail(this.email);
  }
  
  handleEmailTwoChange(value: string | number | null) {
    this.emailTwo = value == null ? '' : value.toString();
    this.validateEmail(this.emailTwo);
  }
}
