import { useState } from 'react';
import { Sheet } from './components/Sheet';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './styles.css';

const MainContent = () => {
	const { user, logout } = useAuth();
	const [showRegister, setShowRegister] = useState(false);

	if (!user) {
		return (
			<div>
				{showRegister ? (
					<div>
						<Register />
						<p className='toggle-auth'>
							Already have an account?{' '}
							<button onClick={() => setShowRegister(false)}>Login</button>
						</p>
					</div>
				) : (
					<div>
						<Login />
						<p className='toggle-auth'>
							Don't have an account?{' '}
							<button onClick={() => setShowRegister(true)}>Register</button>
						</p>
					</div>
				)}
			</div>
		);
	}

	return (
		<div>
			<nav>
				<span>Welcome, {user.name}!</span>
				<button onClick={logout}>Logout</button>
			</nav>
			<Sheet />
		</div>
	);
};

function App() {
	return (
		<AuthProvider>
			<div className='app'>
				<MainContent />
			</div>
		</AuthProvider>
	);
}

export default App;
