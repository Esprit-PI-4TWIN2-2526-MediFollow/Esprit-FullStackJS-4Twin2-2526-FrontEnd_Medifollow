import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RoleService } from '../../services/role/role.service';

type CarouselRole = { id?: string; key: string; label: string; imageKey?: string; isOther?: boolean };
type RoleApiItem = { _id?: string; id?: string; name?: string; label?: string; key?: string; slug?: string };

@Component({
  selector: 'app-role-manage',
  templateUrl: './role-manage.component.html',
  styleUrls: ['./role-manage.component.css']
})
export class RoleManageComponent implements OnInit {
  @Input() roles: CarouselRole[] = [];
  @Output() rolesChange = new EventEmitter<CarouselRole[]>();
  @Output() roleSelected = new EventEmitter<string>();

  private readonly rolesApiUrl = 'http://localhost:3000/api/roles';
  readonly knownRoleImageKeys = ['nurse', 'doctor', 'coordinator', 'auditor', 'patient', 'admin'] as const;

  // Modal states
  showAddRoleModal = false;
  showEditRoleModal = false;
  showDeleteRoleModal = false;

  // Form data
  roleName = '';
  roleError = '';
  isSubmitting = false;
  roleToEdit: CarouselRole | null = null;
  roleToDelete: CarouselRole | null = null;

  constructor(
    private readonly http: HttpClient,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    if (this.roles.length === 0) {
      this.loadRolesFromService();
    }
  }

  // ── Image helpers ─────────────────────────────────────────────
  getRoleImageSrc(role: CarouselRole): string {
    return `/images/roles/${role.imageKey || this.resolveImageKey(role.label)}.svg`;
  }

  private resolveImageKey(name: string): string {
    const n = this.normalizeRoleKey(name);
    if (this.knownRoleImageKeys.includes(n as any)) return n;
    if (n.includes('doctor')) return 'doctor';
    if (n.includes('nurse')) return 'nurse';
    if (n.includes('audit')) return 'auditor';
    if (n.includes('coord')) return 'coordinator';
    if (n.includes('patient')) return 'patient';
    return 'admin';
  }

  private normalizeRoleKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'role';
  }

  private getStableRoleKey(name: string, item?: RoleApiItem): string {
    const apiKey = String(item?.key || item?.slug || '').trim();
    if (apiKey) return this.normalizeRoleKey(apiKey);
    return this.normalizeRoleKey(name);
  }

  // ── Modal actions ────────────────────────────────────────────
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

  // ── CRUD operations ──────────────────────────────────────────
  submitAddRole(): void {
    const name = this.roleName.trim();
    this.roleError = '';

    if (!name) {
      this.roleError = 'Role name is required.';
      return;
    }

    if (this.roles.some(r => r.label.toLowerCase() === name.toLowerCase())) {
      this.roleError = 'Role already exists.';
      return;
    }

    this.isSubmitting = true;
    this.http.post<{ data?: RoleApiItem }>(this.rolesApiUrl, { name }).subscribe({
      next: (res) => {
        const created = res?.data;
        const label = (created?.name || created?.label || name).trim();
        const newRole: CarouselRole = {
          id: created?._id || created?.id || undefined,
          key: this.getStableRoleKey(label, created),
          label,
          imageKey: this.resolveImageKey(label),
        };

        this.roles = [...this.roles, newRole];
        this.rolesChange.emit(this.roles);
        this.roleSelected.emit(newRole.key); // Optionnel : sélectionne le nouveau rôle
        this.isSubmitting = false;
        this.closeAddModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.roleError = err?.error?.message || 'Error creating role.';
      }
    });
  }

  submitEditRole(): void {
    const target = this.roleToEdit;
    if (!target) return;

    const name = this.roleName.trim();
    this.roleError = '';

    if (!name) {
      this.roleError = 'Role name is required.';
      return;
    }

    const duplicate = this.roles.some(r =>
      r !== target && r.label.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      this.roleError = 'Role already exists.';
      return;
    }

    this.isSubmitting = true;

    if (!target.id) {
      // Local update only
      target.label = name;
      target.key = this.getStableRoleKey(name);
      target.imageKey = this.resolveImageKey(name);
      this.rolesChange.emit(this.roles);
      this.isSubmitting = false;
      this.closeEditModal();
      return;
    }

    // API update
    this.http.put<{ data?: RoleApiItem }>(`${this.rolesApiUrl}/${target.id}`, { name }).subscribe({
      next: (res) => {
        const updated = res?.data;
        const label = (updated?.name || updated?.label || name).trim();
        target.label = label;
        target.key = this.getStableRoleKey(label, updated);
        target.imageKey = this.resolveImageKey(label);
        this.rolesChange.emit(this.roles);
        this.isSubmitting = false;
        this.closeEditModal();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.roleError = err?.error?.message || 'Error updating role.';
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
      this.roleSelected.emit(''); // Clear selected role
      this.isSubmitting = false;
      this.closeDeleteModal();
    };

    if (!target.id) {
      removeLocal();
      return;
    }

    this.http.delete(`${this.rolesApiUrl}/${target.id}`).subscribe({
      next: () => removeLocal(),
      error: (err) => {
        this.isSubmitting = false;
        this.roleError = err?.error?.message || 'Error deleting role.';
      }
    });
  }

  // Méthode utilitaire pour charger les rôles depuis le service
  loadRolesFromService(): void {
    this.roleService.getAllRoles().subscribe({
      next: (response: any) => {
        const rolesArray = Array.isArray(response) ? response : (response?.data || []);
        this.roles = rolesArray.map((role: any) => ({
          id: role._id,
          key: this.normalizeRoleKey(role.name || ''),
          label: role.name || '',
          imageKey: this.resolveImageKey(role.name || '')
        }));
        this.rolesChange.emit(this.roles);
      },
      error: (err) => {
        console.error('Error loading roles:', err);
      }
    });
  }
}
