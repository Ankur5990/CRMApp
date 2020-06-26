export const PAGES_MENU = [
  {
    path: 'pages',
    children: [
		{
			path: 'dashboard',
			data: {
			  menu: {
				title: 'Dashboard',
				icon: 'ion-happy',
				selected: false,
				expanded: false,
				order: 0,
			  },
			},
		},
		{
			path: 'leads',
			data: {
			  menu: {
				title: 'Leads',
				icon: 'ion-ios-people',
				selected: false,
				expanded: false,
				order: 0,
			  },
			},
		},
		{
			path: 'orders',
			data: {
			  menu: {
				title: 'Orders',
				icon: 'ion-compose',
				selected: false,
				expanded: false,
				order: 0,
			  },
			},
		}
    ]
  }
];
