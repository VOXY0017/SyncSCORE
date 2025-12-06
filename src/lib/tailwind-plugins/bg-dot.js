const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ matchUtilities, theme }) {
  matchUtilities(
    {
      'bg-dot': (value) => ({
        backgroundImage: `radial-gradient(circle at 1px 1px, ${value} 1px, transparent 0)`,
        backgroundSize: '1rem 1rem',
      }),
    },
    { values: theme('backgroundColor') }
  );
});
