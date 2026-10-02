// Multi-step slides are driven by invisible fragments (.fragment.driver).
// The visible state is derived from which drivers are on, so going forward,
// backward or jumping straight into the slide always renders the right state.
export function readStep(slide) {
  const drivers = [...slide.querySelectorAll('.fragment.driver')];
  let index = -1;
  drivers.forEach((d, i) => {
    if (d.classList.contains('visible')) index = i;
  });
  return { index, name: index >= 0 ? drivers[index].dataset.step : null, drivers };
}

/** Adds one driver fragment per step name at the end of the slide. */
export function addDrivers(slide, names) {
  const notes = slide.querySelector('aside.notes');
  names.forEach((name) => {
    const d = document.createElement('span');
    d.className = 'fragment driver';
    d.dataset.step = name;
    slide.insertBefore(d, notes);
  });
}
