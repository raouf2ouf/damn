export class SignUpInfo {
    name: string;
    username: string;
    email: string;
    password: string;

    constructor(name: string = null, username: string = null, email: string = null, password: string = null) {
        this.name = name;
        this.username = username;
        this.email = email;
        this.password = password;
    }
}
