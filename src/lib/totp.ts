import { authenticator } from 'otplib'
import { HashAlgorithms } from '@otplib/core'
import QRCode from 'qrcode'

export interface TOTPService {
  generateSecret(userEmail: string, issuer?: string): Promise<{ secret: string; otpAuthUrl: string; qrCodeUrl: string }>
  validateUserCode(secret: string, token: string): boolean
  generateQRCodeDataURL(uri: string): Promise<string>
}

// Configure otplib for TOTP
authenticator.options = {
  algorithm: HashAlgorithms.SHA1,
  digits: 6,
  step: 30,
  window: 1,
}

class TOTPServiceImpl implements TOTPService {
  async generateSecret(userEmail: string, issuer = 'NCM PRO') {
    const secret = authenticator.generateSecret()
    const label = encodeURIComponent(`${issuer}:${userEmail}`)
    const encodedIssuer = encodeURIComponent(issuer)
    const otpAuthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
    const qrCodeUrl = await this.generateQRCodeDataURL(otpAuthUrl)
    return { secret, otpAuthUrl, qrCodeUrl }
  }

  validateUserCode(secret: string, token: string) {
    return authenticator.verify({ secret, token })
  }

  async generateQRCodeDataURL(uri: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      QRCode.toDataURL(
        uri,
        {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
          width: 200,
        } as any,
        (err: unknown, url: string) => {
          if (err) return reject(err)
          resolve(url)
        }
      )
    })
  }
}

export const totpService: TOTPService = new TOTPServiceImpl()