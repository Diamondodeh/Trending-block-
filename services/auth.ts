
import { User, UserRole } from '../types';

class AuthService {
  private static USERS_KEY = 'tr3nding_block_users';
  private static CURRENT_USER_KEY = 'tr3nding_block_current_user';

  static getInitialUsers(): User[] {
    const stored = localStorage.getItem(this.USERS_KEY);
    if (stored) return JSON.parse(stored);

    const initial: User[] = [
      { id: '1', email: 'jd1680711@gmail.com', name: 'Main Admin', role: 'MAIN_ADMIN' },
      { id: '2', email: 'admin@admin.com', name: 'Admin User', role: 'ADMIN' },
      { id: '3', email: 'user@user.com', name: 'Regular User', role: 'USER' },
    ];
    localStorage.setItem(this.USERS_KEY, JSON.stringify(initial));
    return initial;
  }

  static getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static login(email: string): User | null {
    const users = this.getInitialUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  }

  static register(name: string, email: string): { user: User | null; error: string | null } {
    const users = this.getInitialUsers();
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: 'Email already registered.' };
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'USER'
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(newUser));
    
    return { user: newUser, error: null };
  }

  static logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  static updateUserRole(userId: string, newRole: UserRole) {
    const users = this.getInitialUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index > -1) {
      users[index].role = newRole;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      const current = this.getCurrentUser();
      if (current?.id === userId) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(users[index]));
      }
    }
  }

  static getAllUsers(): User[] {
    return this.getInitialUsers();
  }
}

export default AuthService;
