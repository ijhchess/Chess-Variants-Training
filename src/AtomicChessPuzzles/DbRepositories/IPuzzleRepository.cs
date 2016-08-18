﻿using AtomicChessPuzzles.Models;
using MongoDB.Driver;
using System.Collections.Generic;

namespace AtomicChessPuzzles.DbRepositories
{
    public interface IPuzzleRepository
    {
        bool Add(Puzzle puzzle);

        Puzzle Get(string id);

        Puzzle GetOneRandomly(List<string> excludedIds, double nearRating = 1500);

        DeleteResult Remove(string id);

        DeleteResult RemoveAllBy(int author);

        bool UpdateRating(string id, Rating newRating);

        List<Puzzle> InReview();

        bool Approve(string id);

        bool Reject(string id);
    }
}
