export { default as AccountMenu } from './AccountMenu';
export { default as AuthGate } from './AuthGate';
export { default as AuthPage } from './AuthPage';
export { default as AuthSplash } from './AuthSplash';
export { default as AvatarPicker, ACCENTS, AVATAR_POSES } from './AvatarPicker';
export { default as PasswordField } from './PasswordField';

export {
  type Account,
  type AuthResult,
  type SignUpInput,
  type UseAuth,
  NEXT_KEY,
  accountCount,
  deleteAccount,
  signIn,
  signOut,
  signUp,
  updateAccount,
  useAuth,
  validateEmail,
  validateName,
  validatePassword,
} from './authStore';

export {
  type Credential,
  type Strength,
  type StrengthLevel,
  INSECURE_CONTEXT_MESSAGE,
  MIN_PASSWORD_LENGTH,
  PBKDF2_ITERATIONS,
  cryptoReady,
  hashPassword,
  passwordStrength,
  verifyPassword,
} from './passwords';
