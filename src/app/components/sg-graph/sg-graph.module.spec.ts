import { SgGraphModule } from './sg-graph.module';

describe('SgGraphModule', () => {
  let sgGraphModule: SgGraphModule;

  beforeEach(() => {
    sgGraphModule = new SgGraphModule();
  });

  it('should create an instance', () => {
    expect(sgGraphModule).toBeTruthy();
  });
});
