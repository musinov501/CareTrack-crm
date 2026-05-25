const generatePatientId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CT-${year}-${random}`;
};

module.exports = {
    generatePatientId
};
