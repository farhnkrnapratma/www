declare global {
	namespace App {
		interface Platform {
			env: {
				GITHUB_TOKEN: string;
				AI?: any;
			};
		}
	}
}

export {};
