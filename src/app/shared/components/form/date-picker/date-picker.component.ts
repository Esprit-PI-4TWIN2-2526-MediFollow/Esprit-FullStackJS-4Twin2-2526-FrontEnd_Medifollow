
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import flatpickr from 'flatpickr';
import "flatpickr/dist/flatpickr.css";

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styles: ``
})
export class DatePickerComponent {

  @Input() id!: string;
  @Input() mode: 'single' | 'multiple' | 'range' | 'time' = 'single';
  @Input() defaultDate?: string | Date | string[] | Date[];
  @Input() minDate?: string | Date;
  @Input() maxDate?: string | Date;
  @Input() themeClass = 'flatpickr-theme-green';
  @Input() label?: string;
  @Input() placeholder?: string;
  @Output() dateChange = new EventEmitter<any>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;

  ngAfterViewInit() {
    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      mode: this.mode,
      static: true,
      disableMobile: true,
      monthSelectorType: 'static',
      dateFormat: 'Y-m-d',
      defaultDate: this.defaultDate,
      minDate: this.minDate,
      maxDate: this.maxDate,
      onReady: (_, __, instance) => {
        if (this.themeClass) {
          instance.calendarContainer.classList.add(this.themeClass);
        }
      },
      onChange: (selectedDates, dateStr, instance) => {
        this.dateChange.emit({ selectedDates, dateStr, instance });
      }
    });
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }
}
