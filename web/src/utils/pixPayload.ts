type PixKeyKind = 'phone' | 'cpf' | 'email' | 'random' | 'unknown';

const RANDOM_KEY_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CPF_MASK_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const onlyDigits = (value: string) => value.replace(/\D/g, '');

function isValidCpf(cpfDigits: string): boolean {
    if (!/^\d{11}$/.test(cpfDigits)) {
        return false;
    }
    if (/^(\d)\1{10}$/.test(cpfDigits)) {
        return false;
    }

    const calcVerifier = (base: string, factor: number) => {
        let total = 0;
        for (const digit of base) {
            total += Number(digit) * factor--;
        }
        const remainder = total % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstVerifier = calcVerifier(cpfDigits.slice(0, 9), 10);
    const secondVerifier = calcVerifier(cpfDigits.slice(0, 10), 11);
    return firstVerifier === Number(cpfDigits[9]) && secondVerifier === Number(cpfDigits[10]);
}

export function getPixKeyKind(rawPixKey: string): PixKeyKind {
    const raw = rawPixKey.trim();
    if (!raw) {
        return 'unknown';
    }

    if (EMAIL_REGEX.test(raw)) {
        return 'email';
    }

    if (RANDOM_KEY_REGEX.test(raw)) {
        return 'random';
    }

    const digits = onlyDigits(raw);
    const hasPhoneFormatting = /[()+\-\s]/.test(raw);

    if ((CPF_MASK_REGEX.test(raw) || /^\d{11}$/.test(raw)) && isValidCpf(digits)) {
        return 'cpf';
    }

    if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
        return 'phone';
    }

    if (hasPhoneFormatting && digits.length >= 10 && digits.length <= 13) {
        return 'phone';
    }

    if (digits.length === 10 || digits.length === 11 || (digits.length >= 12 && digits.length <= 13)) {
        return 'phone';
    }

    return 'unknown';
}

export function normalizePixKey(rawPixKey: string): string {
    const raw = rawPixKey.trim();
    const kind = getPixKeyKind(raw);

    if (kind === 'email') {
        return raw.toLowerCase();
    }

    if (kind === 'cpf') {
        return onlyDigits(raw);
    }

    if (kind === 'phone') {
        const digits = onlyDigits(raw);
        if (!digits) {
            return '';
        }
        if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
            return `+${digits}`;
        }
        if (digits.length === 10 || digits.length === 11) {
            return `+55${digits}`;
        }
        return `+${digits}`;
    }

    return raw;
}

export function isSupportedPixKey(rawPixKey: string): boolean {
    const kind = getPixKeyKind(rawPixKey);
    return kind === 'phone' || kind === 'cpf' || kind === 'email' || kind === 'random';
}

export function generatePixPayload(
    pixKey: string,
    receiverName: string,
    city: string = 'UBERLANDIA-MG',
    amountInCents: number,
    txid: string = ''
): string {
    const formatData = (id: string, value: string) => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const normalizedPixKey = normalizePixKey(pixKey);
    if (!normalizedPixKey) {
        throw new Error('Chave Pix vazia');
    }

    const strAmount = (amountInCents / 100).toFixed(2);
    const safeName = receiverName.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'RECEBEDOR';
    const safeCity = city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'UBERLANDIA-MG';
    const safeTxId = txid || '***'; // Padrão BCB pede *** caso o txid seja vazio

    const gui = 'br.gov.bcb.pix';
    // O ID 00 do Merchant Account Info (26) é o GUI, e o 01 é a Chave PIX
    const merchantAccountInfo = formatData('00', gui) + formatData('01', normalizedPixKey);

    let payload = '';
    payload += formatData('00', '01');
    payload += formatData('26', merchantAccountInfo);
    payload += formatData('52', '0000');
    payload += formatData('53', '986');
    if (amountInCents > 0) {
        payload += formatData('54', strAmount);
    }
    payload += formatData('58', 'BR');
    payload += formatData('59', safeName);
    payload += formatData('60', safeCity);

    const additionalData = formatData('05', safeTxId);
    payload += formatData('62', additionalData);

    payload += '6304';

    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }

    // Como Javascript opera numeros bitwise em 32-bit assinados, devemos limpar e garantir padding.
    const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');

    return payload + crcHex;
}
