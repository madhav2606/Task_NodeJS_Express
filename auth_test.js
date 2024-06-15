const { expect } = require('chai');
const bcrypt = require('bcryptjs');

describe('Hashing my password', () => {
    it('should hash the password correctly', () => {
        const password = 'testpassword';
        const hashedPassword = bcrypt.hashSync(password, 10);

        expect(bcrypt.compareSync(password, hashedPassword)).to.be.true;
    });

    it('should not match incorrect password', () => {
        const password = 'testpassword';
        const hashedPassword = bcrypt.hashSync(password, 10);

        expect(bcrypt.compareSync('wrongpassword', hashedPassword)).to.be.false;
    });
});
