import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell component that hosts the router outlet.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  /** Human-readable application name used for diagnostics and branding hooks. */
  readonly title = 'coop-technical-test';
}
