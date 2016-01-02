﻿using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace AtomicChessPuzzles.Models
{
    public class User
    {
        public ObjectId Id { get; set; }

        [BsonElement("username")]
        public string Username { get; set; }

        [BsonElement("email")]
        public string Email { get; set; }

        [BsonElement("passwordhash")]
        public string PasswordHash { get; set; }

        [BsonElement("salt")]
        public string Salt { get; set; }
    }
}