import { GestureActionDirective } from './gesture-action.directive';
import { GestureControlService } from './gesture-control.service';

describe('GestureActionDirective', () => {
  it('should create an instance', () => {
    const gestureService = jasmine.createSpyObj<GestureControlService>(
      'GestureControlService',
      [],
      { gesture$: jasmine.createSpyObj('gesture$', ['pipe']) }
    );
    const directive = new GestureActionDirective(gestureService);

    expect(directive).toBeTruthy();
  });
});
