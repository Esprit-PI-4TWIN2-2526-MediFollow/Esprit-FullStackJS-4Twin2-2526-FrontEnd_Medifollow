
import { Component } from '@angular/core';

interface MultiOption {
  value: string;
  text: string;
  selected: boolean;
}
interface MultiOption {
  value: string;
  text: string;
  selected: boolean;
}

@Component({
  selector: 'app-select-inputs',
  templateUrl: './select-inputs.component.html',
  styles: ``
})
export class SelectInputsComponent {

  options = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'template', label: 'Template' },
    { value: 'development', label: 'Development' },
  ];
  selectedValue = '';
  selectedValues: string[] = ['1', '3'];

  multiOptions: MultiOption[] = [
    { value: '1', text: 'Option 1', selected: false },
    { value: '2', text: 'Option 2', selected: false },
    { value: '3', text: 'Option 3', selected: false },
    { value: '4', text: 'Option 4', selected: false },
    { value: '5', text: 'Option 5', selected: false },
  ];

  handleSelectChange(value: string) {
    this.selectedValue = value;
    console.log('Selected value:', value);
  }

  handleMultiSelectChange(values: string[]) {
    this.selectedValues = values;
  }
}
