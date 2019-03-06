export class Agent {
  public id?:string;
  public username:string;

  constructor(username:string = null) {
    this.username = username;
  }
}
