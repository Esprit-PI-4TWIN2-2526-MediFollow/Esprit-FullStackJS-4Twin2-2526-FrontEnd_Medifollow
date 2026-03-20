import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Users } from '../../models/users';


@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }
  private apiUrl = 'http://localhost:3000/api';

  //create user with image
  createUser(user: Partial<Users>, avatarFile?: File) {
    const formData = new FormData();

    // Ajouter tous les champs du user
    Object.entries(user).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    // Ajouter l'image si elle existe
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return this.http.post(`${this.apiUrl}/signup`, formData);

  }

  /*  createUser(user: Users) {
     return this.http.post(`${this.apiUrl}/signup`, user);
   } */

  //get all users
  getUsers() {
    return this.http.get<Users[]>(`${this.apiUrl}/users/all`);
  }

  //get user by id
  getUserById(id: string) {
    return this.http.get<Users>(`${this.apiUrl}/users/${id}`);
  }

  //get user by email
  getUserByEmail(email: string) {
    return this.http.get<Users>(`${this.apiUrl}/users/email/${email}`);
  }

  //get user by role
  getUserByRole(role: string) {
    return this.http.get<Users[]>(`${this.apiUrl}/users/role/${role}`);
  }

  //update user avec image
  updateUser(id: string, user: Partial<Users>, avatarFile?: File) {
    const formData = new FormData();

    Object.entries(user).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return this.http.put(`${this.apiUrl}/users/update/${id}`, formData);
  }
  /* updateUser(id: string, user: Users) {
    return this.http.put(`${this.apiUrl}/users/update/${id}`, user);
  } */

  //delete user
  deleteUser(id: string) {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }

}
