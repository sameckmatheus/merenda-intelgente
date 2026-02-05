// Lista de emails autorizados a acessar o dashboard administrativo
export const ADMIN_EMAILS = [
    'polly-pogo@hotmail.com',
    'paulorobertt02023@gmail.com',
    'mrschavex1998@gmail.com',
    'niasufrpe3@gmail.com',
    'obede.silva3@gmail.com',
    'sameckmatheuspro@gmail.com',
    'profissional.victorsilva@gmail.com',
];

export const isAdminEmail = (email: string): boolean => {
    return ADMIN_EMAILS.includes(email.toLowerCase());
};
