﻿using ChessDotNet;
using ChessVariantsTraining.DbRepositories.Variant960;
using ChessVariantsTraining.Models.Variant960;
using ChessVariantsTraining.Services;
using System.Collections.Generic;

namespace ChessVariantsTraining.MemoryRepositories.Variant960
{
    public class GameRepoForSocketHandlers : IGameRepoForSocketHandlers
    {
        Dictionary<string, Game> cache = new Dictionary<string, Game>();
        IGameRepository gameRepository;
        IGameConstructor gameConstructor;

        public GameRepoForSocketHandlers(IGameRepository _gameRepository, IGameConstructor _gameConstructor)
        {
            gameRepository = _gameRepository;
            gameConstructor = _gameConstructor;
        }

        public Game Get(string id)
        {
            if (cache.ContainsKey(id))
            {
                return cache[id];
            }
            else
            {
                Game g = gameRepository.Get(id);
                g.ChessGame = gameConstructor.Construct(g.ShortVariantName, g.LatestFEN);
                cache[id] = g;
                return cache[id];
            }
        }

        public void RegisterMove(Game subject, Move move)
        {
            subject.ChessGame.ApplyMove(move, true);
            subject.LatestFEN = subject.ChessGame.GetFen();
            gameRepository.Update(subject);
        }
    }
}
