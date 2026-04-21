import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RoleService, CarouselRole } from '../../services/role/role.service';

@Component({
  selector: 'app-role-manage',
  templateUrl: './role-manage.component.html',
  styleUrls: ['./role-manage.component.css']
})
export class RoleManageComponent implements OnInit {
  @Input() roles: CarouselRole[] = [];
  @Output() rolesChange = new EventEmitter<CarouselRole[]>();
  @Output() roleSelected = new EventEmitter<string>();

  showAddRoleModal = false;
  showEditRoleModal = false;
  showDeleteRoleModal = false;

  roleName = '';
  roleError = '';
  isSubmitting = false;
  roleToEdit: CarouselRole | null = null;
  roleToDelete: CarouselRole | null = null;

  constructor(
    private readonly roleService: RoleService,
    private readonly translate: TranslateService,
  ) {}

  ngOnInit(): void {
    if (this.roles.length === 0) {
      this.loadRolesFromService();
    }
  }

  getRoleImageSrc(role: CarouselRole): string {
    return this.roleService.getRoleImageSrc(role);
  }

  openAddModal(): void {
    this.roleName = '';
    this.roleError = '';
    this.isSubmitting = false;
    this.showAddRoleModal = true;
  }

  closeAddModal(): void {
    this.showAddRoleModal = false;
    this.roleName = '';
    this.roleError = '';
    this.isSubmitting = false;
  }

  openEditModal(role: CarouselRole): void {
    this.roleToEdit = role;
    this.roleName = role.label;
    this.roleError = '';
    this.isSubmitting = false;
    this.showEditRoleModal = true;
  }

  closeEditModal(): void {
    this.showEditRoleModal = false;
    this.roleToEdit = null;
    this.roleName = '';
    this.roleError = '';
    this.isSubmitting = false;
  }

  openDeleteModal(role: CarouselRole): void {
    this.roleToDelete = role;
    this.roleError = '';
    this.isSubmitting = false;
    this.showDeleteRoleModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteRoleModal = false;
    this.roleToDelete = null;
    this.roleError = '';
    this.isSubmitting = false;
  }

  submitAddRole(): void {
    const name = this.roleName.trim();
    this.roleError = '';

    if (!name) {
      this.roleError = this.translate.instant('MANAGE_ROLES.ERRORS.NAME_REQUIRED');
      return;
    }

    if (this.roles.some(r => r.label.toLowerCase() === name.toLowerCase())) {
      this.roleError = this.translate.instant('MANAGE_ROLES.ERRORS.ALREADY_EXISTS');
      return;
    }

    this.isSubmitting = true;
    this.roleService.createRole(name).subscribe({
      next: (newRole) => {
        this.roles = [...this.roles, newRole];
        this.rolesChange.emit(this.roles);
        this.roleSelected.emit(newRole.key);
        this.isSubmitting = false;
        this.closeAddModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.roleError = err?.error?.message || this.translate.instant('MANAGE_ROLES.ERRORS.CREATE');
      }
    });
  }

  submitEditRole(): void {
    const target = this.roleToEdit;
    if (!target) return;

    const name = this.roleName.trim();
    this.roleError = '';

    if (!name) {
      this.roleError = this.translate.instant('MANAGE_ROLES.ERRORS.NAME_REQUIRED');
      return;
    }

    const duplicate = this.roles.some(r =>
      r !== target && r.label.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      this.roleError = this.translate.instant('MANAGE_ROLES.ERRORS.ALREADY_EXISTS');
      return;
    }

    this.isSubmitting = true;

    if (!target.id) {
      target.label = name;
      target.key = this.roleService.getStableRoleKey(name);
      target.imageKey = this.roleService.resolveImageKey(name);
      this.rolesChange.emit(this.roles);
      this.isSubmitting = false;
      this.closeEditModal();
      return;
    }

    this.roleService.updateRole(target.id, name).subscribe({
      next: (updatedRole) => {
        target.label = updatedRole.label;
        target.key = updatedRole.key;
        target.imageKey = updatedRole.imageKey;
        this.rolesChange.emit(this.roles);
        this.isSubmitting = false;
        this.closeEditModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.roleError = err?.error?.message || this.translate.instant('MANAGE_ROLES.ERRORS.UPDATE');
      }
    });
  }

  confirmDeleteRole(): void {
    const target = this.roleToDelete;
    if (!target) return;

    this.roleError = '';
    this.isSubmitting = true;

    const removeLocal = () => {
      this.roles = this.roles.filter(r => r !== target);
      this.rolesChange.emit(this.roles);
      this.roleSelected.emit('');
      this.isSubmitting = false;
      this.closeDeleteModal();
    };

    if (!target.id) {
      removeLocal();
      return;
    }

    this.roleService.deleteRole(target.id).subscribe({
      next: () => removeLocal(),
      error: (err) => {
        this.isSubmitting = false;
        this.roleError = err?.error?.message || this.translate.instant('MANAGE_ROLES.ERRORS.DELETE');
      }
    });
  }

  loadRolesFromService(): void {
    this.roleService.getAllRolesForCarousel().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.rolesChange.emit(this.roles);
      },
      error: (err) => {
        console.error(this.translate.instant('MANAGE_ROLES.ERRORS.LOAD'), err);
      }
    });
  }
}
