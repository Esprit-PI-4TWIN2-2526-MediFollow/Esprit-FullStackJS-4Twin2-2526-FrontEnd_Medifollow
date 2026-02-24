import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Users } from '../models/users';


@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }
private apiUrl = 'http://localhost:3000/api';

//create user
createUser(user: Users) {
  return this.http.post(`${this.apiUrl}/signup`, user);
}

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

//update user
updateUser(id: string, user: Users) {
  return this.http.put(`${this.apiUrl}/users/update/${id}`, user);
}

//delete user
deleteUser(id: string) {
  return this.http.delete(`${this.apiUrl}/delete/${id}`);
}









}
