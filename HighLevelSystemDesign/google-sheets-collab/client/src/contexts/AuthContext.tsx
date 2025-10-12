import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
	_id: string;
	email: string;
	name: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string, name: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		// Check for saved token and user data
		const savedToken = localStorage.getItem('token');
		const savedUser = localStorage.getItem('user');

		if (savedToken && savedUser) {
			setToken(savedToken);
			setUser(JSON.parse(savedUser));
		}
	}, []);

	const login = async (email: string, password: string) => {
		try {
			const response = await fetch('http://localhost:3001/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				throw new Error('Login failed');
			}

			const data = await response.json();
			setUser(data.user);
			setToken(data.token);
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
		} catch (error) {
			console.error('Login error:', error);
			throw error;
		}
	};

	const register = async (email: string, password: string, name: string) => {
		try {
			const response = await fetch('http://localhost:3001/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password, name }),
			});

			if (!response.ok) {
				throw new Error('Registration failed');
			}

			const data = await response.json();
			setUser(data.user);
			setToken(data.token);
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
		} catch (error) {
			console.error('Registration error:', error);
			throw error;
		}
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	};

	return (
		<AuthContext.Provider value={{ user, token, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
