// Mapping of email to school name(s)
// Some accounts may manage multiple school units
export const SCHOOL_ACCOUNTS: Record<string, string[]> = {
    'marcosfreiremunicipal@gmail.com': ['MARCOS FREIRE', 'ANEXO MARCOS FREIRE'],
    'carlosayresmunicipal@gmail.com': ['CARLOS AYRES'],
    'otaciliamunicipal@gmail.com': ['OTACÍLIA'],
    'francelinamunicipal@gmail.com': ['FRANCELINA'],
    'zuleidemunicipal@gmail.com': ['ZULEIDE'],
    'barbapapamunicipal@gmail.com': ['BARBAPAPA'],
    'crechemaebelamunicipal@gmail.com': ['MÃE BELA'],
    'joaobentomunicipal@gmail.com': ['JOÃO BENTO'],
    'mariaoliveiramunicipal@gmail.com': ['MARIA OLIVEIRA'],
    'mariajosemunicipal@gmail.com': ['MARIA JOSÉ'],
    'sabinomunicipal@gmail.com': ['SABINO'],
    'dilmamunicipal@gmail.com': ['DILMA'],
    'zeliamunicipal@gmail.com': ['ZÉLIA'],
    'gercinamunicipal@gmail.com': ['GERCINA ALVES'],
    'mundocriancamunicipal@gmail.com': ['MUNDO DA CRIANÇA']
};

export function getSchoolsByEmail(email: string): string[] {
    return SCHOOL_ACCOUNTS[email.toLowerCase()] || [];
}

export function isSchoolEmail(email: string): boolean {
    return !!SCHOOL_ACCOUNTS[email.toLowerCase()];
}

