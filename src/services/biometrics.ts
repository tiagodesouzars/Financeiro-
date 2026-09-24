/**
 * WebAuthn Biometrics & Device Authentication Service
 * Uses browser navigator.credentials (Fingerprint, TouchID, FaceID, Android Biometric Prompt, PIN/Pattern)
 */

export interface BiometricAvailability {
  supported: boolean;
  platformAuthenticatorAvailable: boolean;
  biometricType?: 'biometric' | 'device_screen_lock' | 'unsupported';
}

// Convert ArrayBuffer to Base64URL string
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert Base64URL string to ArrayBuffer
function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

/**
 * Check if the current device/browser supports WebAuthn and Platform Authenticator (Fingerprint/Face/Screen Lock)
 */
export async function checkBiometricsAvailability(): Promise<BiometricAvailability> {
  if (
    typeof window === 'undefined' ||
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {
    return {
      supported: false,
      platformAuthenticatorAvailable: false,
      biometricType: 'unsupported',
    };
  }

  try {
    const isPlatformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    return {
      supported: true,
      platformAuthenticatorAvailable: isPlatformAvailable,
      biometricType: isPlatformAvailable ? 'biometric' : 'device_screen_lock',
    };
  } catch {
    return {
      supported: true,
      platformAuthenticatorAvailable: false,
      biometricType: 'device_screen_lock',
    };
  }
}

/**
 * Register device biometrics / screen lock (Touch ID, Fingerprint, Face ID, Android Passkey)
 */
export async function registerDeviceBiometrics(
  userName: string = 'Usuário Pessoal'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const availability = await checkBiometricsAvailability();
    if (!availability.supported) {
      return {
        success: false,
        error: 'Este dispositivo ou navegador não suporta autenticação biométrica WebAuthn.',
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Finanças Pessoais',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userId,
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Built-in biometric sensor on mobile/desktop
        userVerification: 'required',        // Requires Fingerprint / Face / PIN
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Não foi possível cadastrar a biometria.' };
    }

    const credentialId = bufferToBase64Url(credential.rawId);
    return { success: true, credentialId };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Biometric registration error:', error);
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'A solicitação de biometria foi cancelada ou expirou.' };
    }
    return { success: false, error: error.message || 'Falha ao ativar biometria do aparelho.' };
  }
}

/**
 * Authenticate with device biometrics (prompts device fingerprint / face ID)
 */
export async function authenticateWithBiometrics(
  registeredCredentialId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const availability = await checkBiometricsAvailability();
    if (!availability.supported) {
      return {
        success: false,
        error: 'Biometria não suportada neste navegador.',
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = [];
    if (registeredCredentialId) {
      try {
        const rawId = base64UrlToBuffer(registeredCredentialId);
        allowCredentials.push({
          id: rawId,
          type: 'public-key',
          transports: ['internal'],
        });
      } catch (e) {
        console.warn('Could not parse registered credential ID, allowing any platform credential:', e);
      }
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      userVerification: 'required', // Triggers biometric prompt
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Autenticação biométrica não concluída.' };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Biometric verification error:', error);
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Biometria cancelada ou não reconhecida.' };
    }
    return { success: false, error: error.message || 'Erro ao validar biometria.' };
  }
}
