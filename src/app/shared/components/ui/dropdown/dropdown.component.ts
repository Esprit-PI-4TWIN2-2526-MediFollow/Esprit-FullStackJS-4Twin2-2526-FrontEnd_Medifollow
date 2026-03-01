import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnChanges } from '@angular/core';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',})
export class DropdownComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Input() className = '';
  @Input() triggerElement?: HTMLElement;

  @ViewChild('dropdownRef') dropdownRef!: ElementRef<HTMLDivElement>;

  dropdownStyle: any = {};

  private handleClickOutside = (event: MouseEvent) => {
    if (
      this.isOpen &&
      this.dropdownRef &&
      this.dropdownRef.nativeElement &&
      !this.dropdownRef.nativeElement.contains(event.target as Node) &&
      !(event.target as HTMLElement).closest('.dropdown-toggle')
    ) {
      this.close.emit();
    }
  };

  ngOnChanges() {
    if (this.isOpen && this.triggerElement) {
      this.calculatePosition();
    }
  }

  ngAfterViewInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
    if (this.isOpen) {
      this.calculatePosition();
    }
  }

  private calculatePosition() {
    if (!this.triggerElement) return;
    
    const rect = this.triggerElement.getBoundingClientRect();
    this.dropdownStyle = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
      zIndex: '9999999'
    };
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }
}