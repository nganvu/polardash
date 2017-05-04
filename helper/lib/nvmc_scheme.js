var NVMC = { };
NVMC.PhysicsDynamicState = function () {...};
NVMC.InputState = function () {...};
NVMC.Player = function (id) {...};
NVMC.Player.prototype = { //...
	get id()           { ... },
	get dynamicState() { ... },
	get inputState()   { ... }
};
NVMC.GamePlayers = function () {//...
	get count() {...},
	get opponentsCount() {...},
	get all() {...},
	get me() {...},
	get opponents() {...}
};
NVMC.Track = function (){...}
NVMC.Tree = function (){...}
NVMC.Trees = list of Trees
NVMC.Building = function (){...}
NVMC.Buildings = list of Buildings
/*...*/	
NVMC.GameState = function () {...};
	//...
	get players() {...}
};
NVMC.Game = function () {...};

