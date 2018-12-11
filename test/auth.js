const app = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chaiHttp.expect;
const { Model } = require('objection');


const { dbConnect, dbDisconnect, dbGet, dropTables, createTables } = require('../db');
const User = require('../models/user');

describe('Users endpoint', function(){

});