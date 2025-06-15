const httpMocks = require('node-mocks-http');
const controller = require('../controllers/users.controller');
const db = require('../models');

const Users = db.users;
const PatientSummary = db.patientSummary;

jest.mock('../models', () => {
  const mockSave = jest.fn().mockResolvedValue();
  const mockComparePassword = jest.fn().mockResolvedValue(true);

  return {
    users: {
      findOne: jest.fn(),
    },
    patientSummary: jest.fn(() => ({
      save: jest.fn().mockResolvedValue()
    })),
    User: jest.fn(() => ({
      _id: 'user123',
      email: 'test@example.com',
      role: 'patient',
      save: mockSave,
      comparePassword: mockComparePassword
    }))
  };
});


describe('User Controller - Register', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  it('should register a new user and create patient summary', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
    };

    Users.findOne.mockResolvedValue(null);

    const mockSave = jest.fn().mockResolvedValue();
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      role: 'patient',
      save: mockSave,
    };

    Users.mockImplementation(() => mockUser);
    PatientSummary.mockImplementation(() => ({ save: jest.fn().mockResolvedValue() }));

    jest.spyOn(controller, 'generateToken').mockReturnValue('mocked-token');

    await controller.register(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(201);
    expect(data.message).toBe('User registered successfully');
    expect(data.token).toBe('mocked-token');
    expect(controller.generateToken).toHaveBeenCalledWith('user123', 'test@example.com', 'patient');
  });

  it('should return 400 if user already exists', async () => {
    req.body = { email: 'test@example.com' };
    Users.findOne.mockResolvedValue({ _id: 'existing' });

    await controller.register(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(data.message).toBe('User already exists');
  });

  it('should return 500 on registration error', async () => {
    req.body = { email: 'test@example.com' };
    Users.findOne.mockRejectedValue(new Error('DB error'));

    await controller.register(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data.message).toBe('Registration failed');
  });
});

describe('User Controller - Login', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  it('should login successfully', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      isActive: true,
      role: 'doctor',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(),
    };

    Users.findOne.mockResolvedValue(mockUser);
    jest.spyOn(controller, 'generateToken').mockReturnValue('mocked-login-token');

    await controller.login(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.message).toBe('Login successful');
    expect(data.token).toBe('mocked-login-token');
    expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
  });

  it('should return 401 if user not found', async () => {
    req.body = { email: 'test@example.com', password: 'pass' };
    Users.findOne.mockResolvedValue(null);

    await controller.login(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(401);
    expect(data.message).toBe('Invalid credentials');
  });

  it('should return 401 if password mismatch', async () => {
    const mockUser = {
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    req.body = { email: 'test@example.com', password: 'wrongpass' };
    Users.findOne.mockResolvedValue(mockUser);

    await controller.login(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(401);
    expect(data.message).toBe('Invalid credentials');
  });

  it('should return 500 on login error', async () => {
    req.body = { email: 'test@example.com' };
    Users.findOne.mockRejectedValue(new Error('DB error'));

    await controller.login(req, res);
    const data = res._getJSONData();

    expect(res.statusCode).toBe(500);
    expect(data.message).toBe('Login failed');
  });
});
