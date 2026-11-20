import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useBanking } from '../../context/BankingContext';
import { UserRole } from '../../types/banking';
import { Avatar } from '../ui/Avatar';
import { FinoraLogo } from '../ui/FinoraLogo';
import { formatCurrency } from '../../utils/currency';

export const AuthScreen: React.FC = () => {
  const { ledger, signInWithCredentials, quickSignIn, registerCustomerAndSignIn } = useBanking();

  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CUSTOMER);

  const [email, setEmail] = useState('elena.vance@finora-demo.edu');
  const [passcode, setPasscode] = useState('demo-pass-2026');
  const [showPasscode, setShowPasscode] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPasscode, setRegPasscode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === UserRole.ADMIN) {
      setAuthTab('signin');
      setEmail('sarah.jenkins@finora-admin.edu');
    } else {
      setEmail('elena.vance@finora-demo.edu');
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const res = await signInWithCredentials({
      email,
      passcode,
      requestedRole: selectedRole,
    });
    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMessage(res.error ?? 'Unable to authenticate in demo mode.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.includes('@')) {
      setErrorMessage('Please enter a valid educational email address.');
      return;
    }
    if (regPasscode.length < 6) {
      setErrorMessage('Please choose an educational passcode of at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerCustomerAndSignIn({
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      passcode: regPasscode,
    });
    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMessage(res.error ?? 'Could not create simulated customer.');
    }
  };

  const demoCustomers = ledger.users.filter((u) => u.role === UserRole.CUSTOMER).slice(0, 2);
  const demoAdmin = ledger.users.find((u) => u.role === UserRole.ADMIN);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#060D1A] dark:text-[#F0F6FC] flex flex-col justify-between relative overflow-hidden">
      {/* Subtle midnight depth gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 20% 10%, rgba(34, 211, 238, 0.08), transparent 65%), radial-gradient(ellipse 60% 50% at 85% 85%, rgba(14, 116, 144, 0.1), transparent 70%)',
        }}
      />

      {/* Top minimal bar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between gap-6">
        <FinoraLogo />
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
          <ShieldCheck className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
          <span>Educational Banking Sandbox</span>
        </div>
      </header>

      {/* Main split workspace */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left editorial column */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300 tracking-wide">
              Smart Finance. Secure Future.
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-[#F0F6FC] leading-[1.12]">
              Modern digital banking workflows, built for clarity.
            </h1>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
              Explore complete customer account management, simulated deposits and internal transfers,
              statement generation, and compliance administration inside a safe local sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="p-5 rounded-2xl bg-white border border-slate-300/85 shadow-sm dark:shadow-none dark:bg-[#0D182E]/65 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] mb-1.5">
                <Lock className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
                <span>Zero Credential Persistence</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Active demo sessions stay strictly in memory. Passwords and auth tokens are never
                written to browser storage.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-300/85 shadow-sm dark:shadow-none dark:bg-[#0D182E]/65 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-[#F0F6FC] mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
                <span>Simulated Ledger Engine</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every deposit, withdrawal, transfer, and compliance audit updates an isolated
                educational ledger with no real money.
              </p>
            </div>
          </div>

          {/* Quick-access sandbox profiles */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              One-Click Educational Profiles
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {demoCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => quickSignIn(customer.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-cyan-700 dark:bg-[#0D182E]/80 dark:hover:bg-[#13223F] dark:border-slate-700/45 dark:hover:border-cyan-400/40 transition-all text-left cursor-pointer group"
                >
                  <Avatar src={customer.avatarUrl} name={customer.fullName} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-cyan-800 dark:text-[#F0F6FC] dark:group-hover:text-cyan-200 truncate">
                      {customer.fullName}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">Customer</div>
                  </div>
                </button>
              ))}
              {demoAdmin && (
                <button
                  type="button"
                  onClick={() => quickSignIn(demoAdmin.id)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-cyan-700 dark:bg-[#0D182E]/80 dark:hover:bg-[#13223F] dark:border-slate-700/45 dark:hover:border-cyan-400/40 transition-all text-left cursor-pointer group"
                >
                  <Avatar src={demoAdmin.avatarUrl} name={demoAdmin.fullName} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-cyan-800 dark:text-[#F0F6FC] dark:group-hover:text-cyan-200 truncate">
                      {demoAdmin.fullName}
                    </div>
                    <div className="text-[11px] text-cyan-700 dark:text-cyan-300 truncate">Administrator</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right glassmorphic authentication card */}
        <div className="lg:col-span-6">
          <div className="max-w-lg mx-auto rounded-2xl bg-white border border-slate-300 shadow-lg dark:bg-[#0D182E]/80 dark:backdrop-blur-xl dark:border-slate-700/45 p-6 sm:p-8 dark:shadow-2xl dark:shadow-black/40">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-300 dark:bg-[#071122] dark:border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => handleRoleChange(UserRole.CUSTOMER)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedRole === UserRole.CUSTOMER
                    ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Customer Portal</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange(UserRole.ADMIN)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selectedRole === UserRole.ADMIN
                    ? 'bg-white text-cyan-800 border border-cyan-600/40 shadow-sm dark:shadow-none dark:bg-cyan-400/15 dark:text-cyan-300 dark:border-cyan-400/35'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Administrator</span>
              </button>
            </div>

            {/* Sign In / Register mode toggle (Customers only) */}
            {selectedRole === UserRole.CUSTOMER && (
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
                    {authTab === 'signin' ? 'Sign in to Finora' : 'Create Demo Profile'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {authTab === 'signin'
                      ? 'Demo authentication separated from production OAuth'
                      : 'Provision a new simulated customer & checking account'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab(authTab === 'signin' ? 'register' : 'signin');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-medium text-cyan-700 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-200 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {authTab === 'signin' ? 'New Customer?' : 'Back to Sign In'}
                </button>
              </div>
            )}

            {selectedRole === UserRole.ADMIN && (
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-[#F0F6FC]">
                  Administrator Console
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Compliance oversight, customer directory, and audit log review
                </p>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200 leading-relaxed"
              >
                {errorMessage}
              </div>
            )}

            {authTab === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Demo Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@finora-demo.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700/30 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-passcode" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Demo Entry Code (Not Verified)
                    </label>
                    <span className="text-[11px] text-slate-500">Any 6+ characters</span>
                  </div>
                  <div className="relative">
                    <input
                      id="auth-passcode"
                      type={showPasscode ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700/30 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/50"
                    />
                    <button
                      type="button"
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 disabled:opacity-60 dark:text-[#05101F] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Verifying Sandbox Session...'
                      : selectedRole === UserRole.ADMIN
                        ? 'Enter Administrator Console'
                        : 'Enter Customer Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jordan Mercer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jordan@finora-demo.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+94 77 555 0190"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-passcode" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Demo Passcode (Not Saved or Used for Sign-In)
                  </label>
                  <input
                    id="reg-passcode"
                    type="password"
                    required
                    minLength={6}
                    value={regPasscode}
                    onChange={(e) => setRegPasscode(e.target.value)}
                    placeholder="6+ characters (demo only)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-700 dark:bg-[#071122] dark:border-slate-700/60 dark:text-[#F0F6FC] dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 disabled:opacity-60 dark:text-[#05101F] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? 'Provisioning Sandbox...'
                      : `Create Simulated Account (${formatCurrency(250000)} Credit)`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <p className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Educational Notice: Do not enter real banking passwords or personal financial credentials.
              FINORA simulates workflows locally for demonstration.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-5 border-t border-slate-300 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-500">
        <span>FINORA Educational Banking Platform</span>
        <span>Simulated Ledger Architecture · In-Memory Demo Auth</span>
      </footer>
    </div>
  );
};
