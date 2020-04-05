const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {
    setupDatabase,
    userOne,
    userTwo,
    setAuthForUserOne,
    setAuthForUserTwo,
    taskOne,
    taskTwo,
    taskThree
} = require('./fixtures/db');

beforeEach(setupDatabase);

test('Should create task for user', async () => {
    const response = await setAuthForUserOne(request(app).post('/tasks'))
        .send({
            description: 'From my test'
        })
        .expect(201);

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.description).toBe('From my test');
    expect(task.completed).toBe(false);
})

test('Should return the tasks owned by userOne', async () => {
    const response = await setAuthForUserOne(request(app).get('/tasks'))
        .send()
        .expect(200);

    expect(response.body.length).toBe(2);
})

test('Should not delete a task owned by another user', async () => {
    await setAuthForUserTwo(request(app).delete(`/task/${taskOne._id}`))
        .send()
        .expect(404);

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})