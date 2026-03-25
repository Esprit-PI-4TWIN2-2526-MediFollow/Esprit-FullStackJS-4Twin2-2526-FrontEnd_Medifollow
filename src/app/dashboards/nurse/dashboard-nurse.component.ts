import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SymptomsNurseService } from './symptoms/services/symptoms-nurse.service';

@Component({
  selector: 'app-dashboard-nurse',
  templateUrl: './dashboard-nurse.component.html',
  styleUrl: './dashboard-nurse.component.css'
})
export class DashboardNurseComponent implements OnInit {
  pendingCount = 0;
  isLoading = true;

  constructor(
    private router: Router,
    private symptomsNurseService: SymptomsNurseService
  ) {}

  ngOnInit(): void {
    this.symptomsNurseService.getPendingCount().subscribe({
      next: (count) => {
        this.pendingCount = count;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load nurse pending symptoms count', error);
        this.isLoading = false;
      }
    });
  }

  openValidationDashboard(): void {
    this.router.navigate(['/nurse/symptoms']);
  }
}
