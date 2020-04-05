const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { setupDatabase, userOne, setAuthForUserOne } = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should signup a new user', async () => {
    const response = await request(app).post('/users')
        .send({
            name: "Roy",
            email: "testuser@example.com",
            password: "1234567"
        }).expect(201)

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    expect(response.body).toMatchObject({
        user: {
            name: 'Roy',
            email: 'testuser@example.com'
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('1234567');
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login')
        .send({
            email: userOne.email,
            password: userOne.password
        }).expect(200);

    const user = await User.findById(userOne._id);
    expect(user.tokens[1].token).toBe(response.body.token);
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: "nonexistentuser@example.com",
        password: "1234567"
    }).expect(400);
})

test('Should get profile for user', async () => {
    await request(app).get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app).get('/users/me')
        .send()
        .expect(401);
})

test('Should delete account for user', async () => {
    await setAuthForUserOne(request(app).delete('/users/me'))
        .send()
        .expect(200);

    const user = await User.findById(userOne._id);
    expect(user).toBeNull();
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app).delete('/users/me')
        .send()
        .expect(401);
})

test('Should upload avatar image', async () => {
    await setAuthForUserOne(request(app).post('/users/me/avatar'))
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);

    const user = await User.findById(userOne._id);
    expect(user.avatar).toEqual(expect.any(Buffer));
})

test('Should update valid user fields', async () => {
    const newName = 'Jimmie';
    await setAuthForUserOne(request(app).patch('/users/me'))
        .send({
            name: newName
        }).expect(200);

    const user = await User.findById(userOne._id);
    expect(user.name).toBe(newName);
})

test('Should not update invalid user fields', async () => {
    await setAuthForUserOne(request(app).patch('/users/me'))
        .send({
            location: 'canada'
        }).expect(400);
})