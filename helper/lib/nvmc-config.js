NVMC.DefaultRace = {
	track : {
		startPosition : [ -18, -0.0, 10 ],

		leftCurb : [
			-20.0,  0.0,  20.0,
			-20.0,  0.0, -20.0,
			 20.0,  0.0, -20.0,
			 20.0,  0.0,  20.0
		],

		rightCurb : [
			-15,  0.0,  15,
			-15,  0.0, -15,
			 15,  0.0, -15,
			 15,  0.0,  15
		],
	},

	lamps : [
		{
			position : [ 0.0, 0.0, 0.0 ],
			height   : 1.0
		},

		{
			position : [ 1.0, 0.0, 0.0 ],
			height   : 1.0
		}
	],

	trees : [
		{
			position : [ -21.0, 0.0, 10.0 ],
			height   : 1.0
		},

		{
			position : [ -21, 0.0, 11.0 ],
			height   : 1.0
		}
	],

	buildings : [
		{
			outline : [
				-2,  0.0,  2,    3,
				-2,  0.0, -2,    4,
				 2,  0.0, -2,    4,
				 2,  0.0,  2,    3
			]
		}
	],

	weather : {
		sunLightDirection : [ 0.0, -1.0, 0.0 ],
		cloudDensity      : 0.0,
		rainStrength      : 0.0
	}
};
