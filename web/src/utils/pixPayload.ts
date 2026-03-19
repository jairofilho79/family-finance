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

    const strAmount = (amountInCents / 100).toFixed(2);
    const safeName = receiverName.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'RECEBEDOR';
    const safeCity = city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() || 'UBERLANDIA-MG';
    const safeTxId = txid || '***'; // Padrão BCB pede *** caso o txid seja vazio

    const gui = 'br.gov.bcb.pix';
    // O ID 00 do Merchant Account Info (26) é o GUI, e o 01 é a Chave PIX
    const merchantAccountInfo = formatData('00', gui) + formatData('01', pixKey);

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
